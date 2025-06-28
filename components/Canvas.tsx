export default function Canvas() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Typography Editor</h1>

        {/* Preview Area */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="text-4xl p-8 border border-border rounded-lg bg-muted/30">
            The quick brown fox jumps over the lazy dog
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>사이드바는 전역 상태를 통해 제어됩니다.</p>
          <p>현재는 View만 구현된 상태입니다.</p>
        </div>
      </div>
    </div>
  );
}
