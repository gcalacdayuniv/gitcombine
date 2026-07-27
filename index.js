import { fetchRepoTree, fetchFileContent } from './github.js';
import { isTextFile } from './utils.js';
import { html } from './ui.js';

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
        
        let output = `Repository: ${owner}/${repo}\nBranch: ${branch}\n\n`;

        const fetchPromises = files.map(async (file) => {
          const content = await fetchFileContent(owner, repo, branch, file.path);
          if (content !== null) {
             return `\n\n================================================\nFile: ${file.path}\n================================================\n${content}`;
          }
          return '';
        });

        const contents = await Promise.all(fetchPromises);
        output += contents.join('');

        return new Response(output, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
}
