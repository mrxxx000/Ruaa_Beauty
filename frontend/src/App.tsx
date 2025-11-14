import { useEffect, useState } from "react";
import { getMessage } from "./api";
import './App.css';

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getMessage().then(setMsg).catch((err) => {
      console.error("Failed to fetch message:", err);
      setMsg("Failed to load message");
    });
  }, []);

  return <h1>{msg}</h1>;
}

export default App;
