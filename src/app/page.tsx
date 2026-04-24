import HomeMega from "../components/home/HomeMega";
import HomeSearch from "../components/home/HomeSearch";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <HomeSearch />
      <HomeMega />
    </div>
  );
}