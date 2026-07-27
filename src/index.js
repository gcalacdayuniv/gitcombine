// --- UTILS ---
function isTextFile(path) {
  const ext = path.split('.').pop().toLowerCase();
  const textExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'md', 'txt', 'csv',
    'py', 'rb', 'go', 'rs', 'php', 'java', 'c', 'cpp', 'h', 'hpp',
    'sh', 'yml', 'yaml', 'xml', 'toml', 'ini', 'sql', 'gs'
  ];
  return textExtensions.includes(ext);
}

// --- GITHUB API HELPERS ---
async function fetchRepoTree(owner, repo, branch) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Cloudflare-Worker-GithubFlattener'
    }
  });
  
  if (!res.ok && res.status !== 404) {
      throw new Error(`Failed to fetch repository tree: ${res.statusText}`);
  }
  
  return res.json();
}

async function fetchFileContent(owner, repo, branch, path) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(url, {
      headers: {
        'User-Agent': 'Cloudflare-Worker-GithubFlattener'
      }
  });
  
  if (!res.ok) return null;
  return res.text();
}

// --- UI HTML ---
const html = `<!DOCTYPE html>
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
    button:disabled { background: #888; cursor: not-allowed; }
    
    .status-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
    #status { font-weight: bold; color: #0056b3; }
    
    .action-buttons { display: flex; gap: 10px; }
    #copyBtn { background: #28a745; display: none; }
    #copyBtn:hover { background: #218838; }
    #downloadBtn { background: #007bff; display: none; }
    #downloadBtn:hover { background: #0056b3; }
    
    textarea { width: 100%; height: 500px; margin-top: 10px; padding: 15px; font-family: monospace; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; white-space: pre; background: #f8f9fa; }
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
  
  <div class="status-bar">
    <div id="status">Ready.</div>
    <div class="action-buttons">
      <button type="button" id="copyBtn">Copy to Clipboard</button>
      <button type="button" id="downloadBtn">Download .txt</button>
    </div>
  </div>
  <textarea id="output" readonly placeholder="Output will stream here..."></textarea>
  
  <script>
    const output = document.getElementById('output');
    const status = document.getElementById('status');
    const btn = document.getElementById('btn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Copy Button Logic
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(output.value);
        const originalText = copyBtn.innerText;
        copyBtn.innerText = '✅ Copied!';
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      } catch (err) {
        alert('Failed to copy text. Your browser might block this action.');
      }
    });

    // Download Button Logic
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([output.value], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      
      // Determine filename from the input URL
      const repoUrl = document.getElementById('url').value;
      const repoName = repoUrl.split('/').filter(Boolean).pop() || 'repository';
      a.download = repoName + '-flattened.txt';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    });

    // Form Submission Logic
    document.getElementById('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('url').value;
      const branch = document.getElementById('branch').value || 'main';
      
      output.value = '';
      status.innerText = 'Fetching repository structure...';
      status.style.color = '#0056b3';
      btn.disabled = true;
      copyBtn.style.display = 'none';
      downloadBtn.style.display = 'none';
      
      try {
        const res = await fetch('/api/flatten?url=' + encodeURIComponent(url) + '&branch=' + encodeURIComponent(branch));
        
        if (!res.ok) {
          status.innerText = 'Error occurred.';
          status.style.color = 'red';
          output.value = 'Error: ' + await res.text();
          btn.disabled = false;
          return;
        }

        status.innerText = 'Compiling files in real-time...';
        
        // Read the streaming response chunks as they arrive
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          output.value += decoder.decode(value, { stream: true });
          output.scrollTop = output.scrollHeight; // Auto-scroll to bottom
        }
        
        status.innerText = '✅ Compilation complete!';
        status.style.color = 'green';
        copyBtn.style.display = 'block';
        downloadBtn.style.display = 'block';
        
      } catch (err) {
        status.innerText = 'Network error occurred.';
        status.style.color = 'red';
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;

// --- WORKER ROUTING ---
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (url.pathname === '/api/flatten') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) return new Response('Missing URL', { status: 400 });

      try {
        const match = targetUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return new Response('Invalid GitHub URL', { status: 400 });

        const owner = match[1];
        const repo = match[2].replace('.git', '');
        const branch = url.searchParams.get('branch') || 'main';

        const treeData = await fetchRepoTree(owner, repo, branch);
        
        if (treeData.message) {
            return new Response(`GitHub API Error: ${treeData.message}`, { status: 400 });
        }

        const files = treeData.tree.filter(item => item.type === 'blob' && isTextFile(item.path));
        
        // Set up a TransformStream to stream data to the client
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        // Run the fetching process asynchronously without blocking the response creation
        ctx.waitUntil((async () => {
          try {
            await writer.write(encoder.encode(`Repository: ${owner}/${repo}\nBranch: ${branch}\n`));
            
            for (const file of files) {
              const content = await fetchFileContent(owner, repo, branch, file.path);
              if (content !== null) {
                const chunk = `\n\n================================================\nFile: ${file.path}\n================================================\n${content}`;
                await writer.write(encoder.encode(chunk));
              }
            }
          } catch (error) {
            await writer.write(encoder.encode(`\n\nError fetching files: ${error.message}`));
          } finally {
            await writer.close();
          }
        })());

        // Return the readable end of the stream immediately
        return new Response(readable, {
          headers: { 
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });

      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
}
