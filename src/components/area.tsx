import { ReactElement } from "react";
import { Card, Icon, Text } from "react-native-paper";
import { StyleSheet, View } from "react-native";

export default function Area({
  title,
  icon,
  children,
  right,
}: {
  title: string;
  icon: string;
  children?: ReactElement | ReactElement[];
  right?: undefined | ReactElement;
}) {
  return (
    <Card>
      <Card.Content>
        <View style={styles.container}>
          <View style={styles.header}>
            <Icon size={22} source={icon} />
            <Text style={styles.text} variant={"titleMedium"}>
              {title}
            </Text>
            {right}
          </View>
          {children && <View style={styles.content}>{children}</View>}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  text: {
    flex: 1,
  },
  content: {
    gap: 10,
  },
});
