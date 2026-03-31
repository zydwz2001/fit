export function StatusBar() {
  return (
    <div className="h-11 px-8 flex justify-between items-center text-[13px] font-bold">
      <span>09:41</span>
      <div className="flex gap-1.5 items-center">
        <i className="fas fa-signal"></i>
        <i className="fas fa-wifi"></i>
        <i className="fas fa-battery-full text-vibe-green"></i>
      </div>
    </div>
  );
}
