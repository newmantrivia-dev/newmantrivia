const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      stage: 0,
      features: {
        "color-mix": true,
        "lab-function": true,
        "oklab-function": true,
      },
    },
  },
};

export default config;
