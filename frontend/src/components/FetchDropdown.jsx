// component that fetches data
import { useState } from "react";

// DANGEROUS: These queries are directly visible in browser dev tools
const PREDEFINED_QUERIES = {
  getAllUsers: `SELECT * FROM users`,
  getUserEmails: `SELECT id, email FROM users`,
  getUsersAlphabetically: `SELECT * FROM users ORDER BY last_name`,
  getEmailCount: `SELECT COUNT(*) FROM users`,
  // route for creating a user via the backend API
  createNewUser: '/api/execute-sql/createNewUser',
};

const ExposedSQLExample = () => {
  const [selectedQuery, setSelectedQuery] = useState("getAllUsers");
  const [results, setResults] = useState([]);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [queryLoading, setQueryLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [queryErrorMessage, setQueryErrorMessage] = useState('');
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState('');


  // These connection details would be visible in the browser
  const DB_CONFIG = {
    host: "dpg-d3q19sripnbc73a8ggsg-a",
    database: "disc_render_demo",
    user: "disc_render_demo_user",
    // NEVER put credentials in frontend code!
    password: "LVhc5eTfZRoh34INttBOKurhqYv21X7s",
  };

  const executeQuery = async () => {
    setQueryErrorMessage('');
    setQueryLoading(true);
    setResults([]);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/execute-sql`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: PREDEFINED_QUERIES[selectedQuery],
            config: DB_CONFIG, // NEVER send this!
          }),
        }
      );

      // try to parse body (json preferred) (this is why i hate JS)
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }

      if (!response.ok) {
        // extract message from json body when possible
        const msg = data && typeof data === 'object' && data.error ? data.error : (typeof data === 'string' ? data : response.statusText);
        setQueryErrorMessage(`(${response.status}) ${msg}`);
        return;
      }

      // success
      setResults(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (err) {
      setQueryErrorMessage(err?.message || String(err));
      console.error('Query failed:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitErrorMessage('');
    setSubmitSuccessMessage('');
    setSubmitLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}${PREDEFINED_QUERIES.createNewUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: createForm.first_name,
          last_name: createForm.last_name,
          email: createForm.email,
        }),
      });

      const text = await resp.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }

      if (!resp.ok) {
        const errMsg = data && data.error ? data.error : (typeof data === 'string' ? data : resp.statusText);
        setSubmitErrorMessage(`(${resp.status}) ${errMsg}`);
        return;
      }

      // success
      setCreateForm({ first_name: '', last_name: '', email: '' });
      setSubmitSuccessMessage('User created successfully');
      // refresh results if viewing all users
      if (selectedQuery === 'getAllUsers') await executeQuery();
    } catch (err) {
      setSubmitErrorMessage(err?.message || String(err));
      console.error('Create user failed:', err);
    } finally {
      setSubmitLoading(false);
      // clear success message after a short delay
      if (submitSuccessMessage) {
        setTimeout(() => setSubmitSuccessMessage(''), 3000);
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <h2 className="font-bold text-yellow-800">🔍 Developer Note:</h2>
        <p className="text-yellow-800">
          Open Chrome DevTools (F12) and look at the Sources tab to see all
          these SQL queries and database credentials exposed in the frontend
          code!
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Database Query Interface</h2>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <h3 className="font-semibold mb-2">Create New User</h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-2 mb-2 !text-black">
              <input name="first_name" value={createForm.first_name} onChange={handleCreateInputChange} placeholder="First Name" required className="border p-2 rounded" />
              <input name="last_name" value={createForm.last_name} onChange={handleCreateInputChange} placeholder="Last Name" required className="border p-2 rounded" />
              <input name="email" value={createForm.email} onChange={handleCreateInputChange} placeholder="Email" type="email" required className="border p-2 rounded" />
              <button type="submit" disabled={submitLoading} className={`bg-green-600 text-white px-3 py-2 rounded ${submitLoading ? 'opacity-60 cursor-wait' : ''}`}>
                {submitLoading ? 'Creating…' : 'Create User'}
              </button>
            </form>
          </div>

          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">Select Query:</label>
              <select
                value={selectedQuery}
                onChange={(e) => setSelectedQuery(e.target.value)}
                className="w-full border rounded-md p-2 text-black"
              >
                {Object.keys(PREDEFINED_QUERIES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">SQL to be executed:</label>
              <pre className="bg-gray-50 p-3 rounded border text-black text-wrap">
                {selectedQuery === 'createNewUser' ?
                  'Create new user on the left, don\'t press query button below'
                  : PREDEFINED_QUERIES[selectedQuery]}
              </pre>
            </div>

            <div>
                  <button
                    onClick={executeQuery}
                    disabled={queryLoading || selectedQuery === 'createNewUser'}
                    className={`bg-blue-500 text-white px-4 py-2 rounded ${queryLoading || selectedQuery === 'createNewUser' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                  >
                    {queryLoading ? 'Running…' : 'Run Query'}
                  </button>
                </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-6 text-black">
            <h3 className="font-bold mb-2">Results:</h3>
            <div className="">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(results[0]).map((key) => (
                      <th key={key} className="border px-4 py-2 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="border px-4 py-2">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Query error block */}
      {queryErrorMessage && (
        <div className='border border-red-300 p-2 text-red-800 bg-red-100 mt-4'>
          <div className="font-semibold">Error running query</div>
          <div>{queryErrorMessage}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={executeQuery} disabled={queryLoading} className="bg-gray-200 px-2 py-1 rounded">Retry</button>
          </div>
        </div>
      )}

      {/* Submission result block */}
      {(submitErrorMessage || submitSuccessMessage) && (
        <div className={`border p-2 mt-4 ${submitErrorMessage ? 'border-red-300 text-red-800 bg-red-100' : 'border-green-300 text-green-800 bg-green-100'}`}>
          {submitErrorMessage ? (
            <div>
              <div className="font-semibold">Error creating new user</div>
              <div>{submitErrorMessage}</div>
            </div>
          ) : (
            <div>{submitSuccessMessage}</div>
          )}
        </div>
      )}

      <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
        <h3 className="font-bold text-red-700">Security Risks:</h3>
        <ul className="ml-1 text-red-700 text-left">
          <li>SQL queries visible in source code</li>
          <li>Database credentials exposed</li>
          <li>Table structure revealed</li>
          <li>Sensitive data potentially exposed</li>
        </ul>
      </div>
    </div>
  );
};

export default ExposedSQLExample;