import { View, Text, StyleSheet, Image, TextInput, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { defaultPizzaImage } from '@components/ProductListItem';
import Colors from '@/constants/Colors';
import Button from '@components/Button';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MediaType } from 'expo-image-picker/src/ImagePicker.types';
import { useDeleteProduct, useInsertProduct, useProduct, useUpdateProduct } from '@/api/products';
import { randomUUID } from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { File } from 'expo-file-system';

const CreateScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState('image/jpeg');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState('');

  const { id: idString } = useLocalSearchParams();
  const isUpdating = !!idString;

  const { mutate: insertProduct } = useInsertProduct();
  const { mutate: updateProduct } = useUpdateProduct();
  const id = parseFloat(typeof idString === 'string' ? idString : idString?.[0]);
  const { data: updatingProduct } = useProduct(id);
  const { mutate: deleteProduct } = useDeleteProduct();

  const router = useRouter();

  useEffect(() => {
    if (updatingProduct) {
      setName(updatingProduct.name);
      setPrice(updatingProduct.price.toString());
      setImage(updatingProduct.image);
    }
  }, [updatingProduct]);

  const validateInput = () => {
    setErrors('');
    if (!name) {
      setErrors('Name is required');
      return false;
    }
    if (!price) {
      setErrors('Price is required');
      return false;
    }
    if (isNaN(parseFloat(price))) {
      setErrors('Price should be a number');
      return false;
    }
    return true;
  };

  const resetFields = () => {
    setName('');
    setPrice('');
    setImage('');
  };

  const onSubmit = () => {
    if (isUpdating) {
      onUpdate();
    } else {
      onCreate();
    }
  };

  const onUpdate = async () => {
    if (!validateInput()) {
      return;
    }

    const imagePath = await uploadImage();
    if (imagePath === null) {
      return;
    }
    updateProduct(
      { id, name, price: parseFloat(price), image: imagePath },
      {
        onSuccess: () => {
          resetFields();
          router.back();
        },
      },
    );
    resetFields();
    router.back();
  };

  const onCreate = async () => {
    if (!validateInput()) {
      return;
    }

    const imagePath = await uploadImage();
    if (imagePath === null) {
      return;
    }

    insertProduct(
      { name, price: parseFloat(price), image: imagePath },
      {
        onSuccess: () => {
          resetFields();
          router.back();
        },
      },
    );
  };

  const onDelete = () => {
    deleteProduct(id, {
      onSuccess: () => {
        resetFields();
        router.replace('/(admin)');
      },
    });
  };

  const onConfirmDelete = () => {
    Alert.alert('Confirm', 'Are you sure you want to delete this product', [
      {
        text: 'Cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as MediaType,
      allowsEditing: true,
      aspect: [4, 3],
      // < 1 makes the picker re-encode (JPEG) instead of returning the original, which can be
      // a multi-MB HEIC/AVIF; the product-images bucket accepts up to 5 MB of png/jpeg/webp
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageType(result.assets[0].mimeType ?? 'image/jpeg');
    }
  };
  const uploadImage = async () => {
    if (!image?.startsWith('file://')) {
      return;
    }

    const arrayBuffer = await new File(image).arrayBuffer();
    // Real type of the picked file, so the bucket's MIME check means something
    const contentType = imageType;
    const filePath = `${randomUUID()}.${contentType.split('/')[1] ?? 'jpg'}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, arrayBuffer, { contentType });

    if (error || !data) {
      // e.g. a Live Photo comes back as HEIC, or the file is over the bucket's 5 MB limit
      Alert.alert('Image upload failed', error?.message ?? 'Please try another image');
      return null;
    }
    return data.path;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: isUpdating ? 'Update Product' : 'Create Product' }} />
      <Image
        source={{ uri: image || defaultPizzaImage }}
        style={styles.image}
        resizeMode="contain"
      />
      <Text onPress={pickImage} style={styles.textButton}>
        Select Image
      </Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Margarita..."
        style={styles.input}
      />

      <Text style={styles.label}>Price ($)</Text>
      <TextInput
        value={price}
        onChangeText={setPrice}
        placeholder="9.99"
        style={styles.input}
        keyboardType="numeric"
      />
      <Text style={styles.error}>{errors}</Text>
      <Button onPress={onSubmit} text={isUpdating ? 'Update' : 'Create'} />
      {isUpdating && (
        <Text onPress={onConfirmDelete} style={styles.textButton}>
          Delete
        </Text>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  image: {
    width: '50%',
    aspectRatio: 1,
    alignSelf: 'center',
  },
  textButton: {
    alignSelf: 'center',
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginVertical: 10,
  },
  label: {
    color: 'gray',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginTop: 5,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});

export default CreateScreen;
