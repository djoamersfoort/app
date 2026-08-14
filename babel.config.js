module.exports = function (api) {
  api.cache(true);

  return {
    presets: [["babel-preset-expo"], "nativewind/babel"],

    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            // Source lives under src/, so "@/..." resolves there.
            "@": "./src",
          },
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
