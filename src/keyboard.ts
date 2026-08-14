import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Height the on-screen keyboard currently occupies, or 0.
 *
 * Action sheets render inside a modal, where Android's window resizing does not
 * reach, so anything anchored to the bottom has to move itself out of the way.
 */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      (event) => setHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setHeight(0),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
