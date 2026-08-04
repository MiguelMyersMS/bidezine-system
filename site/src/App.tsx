import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { HomeRoute } from "@/routes/HomeRoute"
import { ComponentRoute } from "@/routes/ComponentRoute"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: "components/:slug", element: <ComponentRoute /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
