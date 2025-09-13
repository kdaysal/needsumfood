function CategoryCard({ title }) {
  return (
    <button className="w-full rounded-2xl shadow-md bg-white p-6 text-left hover:shadow-lg transition">
      <h2 className="text-xl font-medium text-gray-700">{title}</h2>
    </button>
  );
}

export default CategoryCard;
