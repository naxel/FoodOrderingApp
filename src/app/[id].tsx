import {Text, View} from "react-native";
import {useLocalSearchParams} from "expo-router";

const ProductDetailsScreen = () => {
    const {id} = useLocalSearchParams()
    return (
        <View>
            <Text>ProductDetailsScreen</Text>
        </View>
    );
}

export default ProductDetailsScreen;