import AppRoutes from "./routes/AppRoutes";
import { useContext } from "react";
import { ThemeContext } from "./context/ThemeContext";

function App() {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`app ${theme}`}>
      <AppRoutes />
    </div>
  );
}

export default App;