import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { NextUIProvider, createTheme } from "@nextui-org/react";

import NotFoundPage from "./pages/NotFoundPage";
import MainPage from "./pages/MainPage";
import DocumentationPage from "./pages/DocumentationPage";

const theme = createTheme({
  type: "dark", // it could be "light" or "dark"
  theme: {
    colors: {
      // brand colors
      primaryLight: "$blue200",
      primaryLightHover: "$blue300",
      primaryLightActive: "$blue400",
      primaryLightContrast: "$blue600",
      primary: "#0072F5",
      primaryBorder: "$blue500",
      primaryBorderHover: "$blue600",
      primarySolidHover: "$blue700",
      primarySolidContrast: "$white",
      primaryShadow: "$blue500",

      gradient:
        "linear-gradient(112deg, $blue100 -25%, $pink500 -10%, $purple500 80%)",
      link: "#5E1DAD",
    },
    space: {},
    fonts: {},
  },
});

function App() {
  return (
    <NextUIProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="docs" element={<DocumentationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </NextUIProvider>
  );
}

export default App;
