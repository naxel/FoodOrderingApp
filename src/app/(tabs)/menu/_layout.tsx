import { Stack } from "expo-router";
import {Menu} from "expo-router/build/primitives/menu";

export default function MenuStack() {
    return <Stack>
        <Stack.Screen name='index' options={{title: 'Menu'}} />
    </Stack>
}
