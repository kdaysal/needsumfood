function UserGreeting({ username }) {
  return (
    <div className="text-lg text-gray-600">
      Welcome, <span className="font-semibold">{username}</span> 👋
    </div>
  );
}

export default UserGreeting;
