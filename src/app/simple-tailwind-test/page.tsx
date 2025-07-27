export default function SimpleTailwindTest() {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#000' }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>Simple Tailwind Test</h1>
      
      {/* Basic Test - Should have red background */}
      <div className="bg-red-500 text-white p-4 mb-4">
        This should have a RED background if Tailwind is working
      </div>
      
      {/* Blue Test */}
      <div className="bg-blue-500 text-white p-4 mb-4">
        This should have a BLUE background if Tailwind is working
      </div>
      
      {/* Green Test */}
      <div className="bg-green-500 text-white p-4 mb-4">
        This should have a GREEN background if Tailwind is working
      </div>
      
      {/* Text Color Test */}
      <div style={{ backgroundColor: 'white', padding: '16px', marginBottom: '16px' }}>
        <p className="text-red-500">This text should be RED</p>
        <p className="text-blue-500">This text should be BLUE</p>
        <p className="text-green-500">This text should be GREEN</p>
      </div>
      
      {/* Spacing Test */}
      <div style={{ backgroundColor: 'white', padding: '16px' }}>
        <div className="p-4 bg-gray-200">Padding test (p-4)</div>
        <div className="m-4 bg-gray-300">Margin test (m-4)</div>
      </div>
      
      <p style={{ color: 'white', marginTop: '20px' }}>
        If you see colored backgrounds and text, Tailwind is working.
        If everything looks plain, Tailwind is NOT working.
      </p>
    </div>
  )
}