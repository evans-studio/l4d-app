export default function DebugTailwind() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#111', color: '#fff' }}>
      <h1>Tailwind Debug Test</h1>
      
      {/* Test 1: Basic colors - should work in any Tailwind version */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Test 1: Basic colors</h2>
        <div className="bg-red-500">Red background (bg-red-500)</div>
        <div className="bg-blue-500">Blue background (bg-blue-500)</div>
        <div className="bg-green-500">Green background (bg-green-500)</div>
      </div>
      
      {/* Test 2: Padding/Margins */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Test 2: Spacing</h2>
        <div className="p-4" style={{ backgroundColor: '#333' }}>Padding (p-4)</div>
        <div className="m-4" style={{ backgroundColor: '#555' }}>Margin (m-4)</div>
      </div>
      
      {/* Test 3: Text colors */}
      <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '10px' }}>
        <h2 style={{ color: '#000' }}>Test 3: Text colors</h2>
        <p className="text-red-500">Red text (text-red-500)</p>
        <p className="text-blue-500">Blue text (text-blue-500)</p>
        <p className="text-green-500">Green text (text-green-500)</p>
      </div>
      
      {/* Test 4: Typography */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Test 4: Typography</h2>
        <p className="text-sm">Small text (text-sm)</p>
        <p className="text-lg">Large text (text-lg)</p>
        <p className="text-xl">XL text (text-xl)</p>
        <p className="font-bold">Bold text (font-bold)</p>
      </div>
      
      {/* Inspection note */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#222', border: '1px solid #444' }}>
        <h3>Debug Instructions:</h3>
        <ol style={{ marginLeft: '20px' }}>
          <li>Right-click and "Inspect Element" on the colored divs above</li>
          <li>Check if CSS classes like "bg-red-500" are being applied</li>
          <li>Check if those classes have actual CSS rules (background-color: rgb(239, 68, 68))</li>
          <li>If classes are there but no styles, Tailwind CSS is not being compiled</li>
          <li>If classes are missing entirely, Tailwind is not being processed</li>
        </ol>
      </div>
    </div>
  )
}