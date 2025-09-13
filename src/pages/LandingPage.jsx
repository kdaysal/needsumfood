import Header from "../components/Header";
import UserGreeting from "../components/UserGreeting";
import CategoryCard from "../components/CategoryCard";

const categories = ["Groceries", "Toys", "Tools", "Bills", "Chores"];

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />
      <UserGreeting username="Kevin" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {categories.map((cat, idx) => (
          <CategoryCard key={idx} title={cat} />
        ))}
      </div>
    </div>
  );
}

export default LandingPage;
