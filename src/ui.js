export const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Flattener</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
    button { padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #333; }
    textarea { width: 100%; height: 500px; margin-top: 20px; padding: 15px; font-family: monospace; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; white-space: pre; }
  </style>
</head>
<body>
  <h1>GitHub Flattener API</h1>
  <form id="form">
    <div class="form-group">
      <label for="url">GitHub Repository URL</label>
      <input type="url" id="url" placeholder="https://github.com/owner/repo" required />
    </div>
    <div class="form-group">
      <label for="branch">Branch (defaults to main)</label>
      <input type="text" id="branch" placeholder="main" />
    </div>
    <button type="submit" id="btn">Compile Repository</button>
  </form>
  <textarea id="output" readonly placeholder="Output will appear here..."></textarea>
  
  <script>
    document.getElementById('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('url').value;
      const branch = document.getElementById('branch').value || 'main';
      const output = document.getElementById('output');
      const btn = document.getElementById('btn');
      
      output.value = 'Fetching and compiling files... This may take a moment for large repositories.';
      btn.disabled = true;
      
      try {
        const res = await fetch('/api/flatten?url=' + encodeURIComponent(url) + '&branch=' + encodeURIComponent(branch));
        if (res.ok) {
          output.value = await res.text();
        } else {
          output.value = 'Error fetching repository data: ' + await res.text();
        }
      } catch (err) {
        output.value = 'Network error occurred.';
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
