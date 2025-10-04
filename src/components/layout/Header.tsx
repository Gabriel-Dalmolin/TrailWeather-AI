import { Mountain } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary p-2 rounded-lg">
            <Mountain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">TrailWeather AI</h1>
            <p className="text-xs text-muted-foreground">NASA Space Apps Challenge 2025</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
