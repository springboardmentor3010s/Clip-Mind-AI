export function Loader({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full border-2 border-primary/20 border-t-primary animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
