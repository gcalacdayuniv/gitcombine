export async function fetchRepoTree(owner, repo, branch) {
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

export async function fetchFileContent(owner, repo, branch, path) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(url, {
      headers: {
        'User-Agent': 'Cloudflare-Worker-GithubFlattener'
      }
  });
  
  if (!res.ok) return null;
  return res.text();
}
