export default function () {
  const numsMessages = Math.floor(Math.random() * 5) + 2;
  return (
    <div className="flex-1 overflow-hidden bg-gray-50">
      <div className="h-[calc(100vh-65px)] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {[...Array(numsMessages)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl w-2/3 p-4 ${
                    i % 2 === 0
                      ? "bg-blue-600/10 rounded-br-none"
                      : "bg-white rounded-bl-none border border-gray-200"
                  }`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
