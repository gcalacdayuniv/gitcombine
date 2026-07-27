export function isTextFile(path) {
  const ext = path.split('.').pop().toLowerCase();
  const textExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'md', 'txt', 'csv',
    'py', 'rb', 'go', 'rs', 'php', 'java', 'c', 'cpp', 'h', 'hpp',
    'sh', 'yml', 'yaml', 'xml', 'toml', 'ini', 'sql', 'gs'
  ];
  return textExtensions.includes(ext);
}
