
const TryItOutPopup = ({ shortcut }: { shortcut: string }) => {
  return (
    <div className="absolute top-full left-0 mt-2 w-96 p-4 bg-white border border-gray-300 shadow-lg rounded-md z-10">
      <p className="text-sm font-medium">
        Type the shortcut <span className="text-blue-500 font-bold">{shortcut}</span> in the text box:
      </p>
      <textarea
        className="w-full mt-2 p-2 border border-gray-300 rounded-md"
        rows={3}
        placeholder="Type here..."
      />
      <p className="text-xs text-gray-500 mt-2">
        When typed, your shortcut will insert the snippet. This will work on any website. You can also right-click on text boxes to select a snippet.
      </p>

    </div>
  );
};

export default TryItOutPopup;