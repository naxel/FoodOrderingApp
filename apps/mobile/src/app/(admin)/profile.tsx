import { View, Button } from 'react-native';
import React from 'react';
import { signOut } from '@/providers/AuthProvider';

const ProfileScreen = () => {
  return (
    <View>
      <Button onPress={signOut} title="Sign out" />
    </View>
  );
};

export default ProfileScreen;
