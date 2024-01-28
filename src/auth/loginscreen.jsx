import { SafeAreaView } from "react-native";
import { useTheme, Button } from "react-native-paper";

export default function LoginScreen({ onPress }) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={{
        ...styles.container,
        backgroundColor: theme.colors.primaryContainer,
      }}
    >
      <Button
        style={styles.button}
        labelStyle={{ fontSize: 17 }}
        contentStyle={{ height: 50 }}
        mode={"contained"}
        onPress={onPress}
      >
        Log in
      </Button>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  button: {
    margin: 15,
    borderRadius: 25,
  },
};
