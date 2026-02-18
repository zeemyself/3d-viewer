import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">3D Viewer</h1>
    </div>
  );
}
