export default function LoginPage() {
  return (
    <div className="min-h-screen flex justify-center items-center">
      <form className="bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl mb-4">登入</h2>
        <input
          type="text"
          placeholder="用戶名"
          className="border p-2 mb-4 w-full"
        />
        <input
          type="password"
          placeholder="密碼"
          className="border p-2 mb-4 w-full"
        />
        <button className="bg-blue-500 text-white p-2 rounded w-full">
          登入
        </button>
      </form>
    </div>
  );
}