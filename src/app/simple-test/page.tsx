export default function SimpleTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'blue', fontSize: '24px' }}>Simple Test Page</h1>
      <div style={{ backgroundColor: 'yellow', padding: '10px', margin: '10px 0' }}>
        This should be yellow (inline styles)
      </div>
      <div className="bg-red-500 text-white p-4 mb-4">
        This should be red with white text (Tailwind classes)
      </div>
      <button 
        style={{ 
          backgroundColor: 'green', 
          color: 'white', 
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Inline Styled Button
      </button>
      <button className="bg-blue-500 text-white px-4 py-2 rounded ml-4">
        Tailwind Button
      </button>
    </div>
  )
}