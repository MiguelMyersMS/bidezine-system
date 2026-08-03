import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ModalFormDemo } from "./ModalFormDemo"
import "@/styles/system.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ModalFormDemo />
  </StrictMode>
)
