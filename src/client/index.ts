interface Commit {
  sha: string;
  html_url: string;
  message: string;
  date: string;
}

interface CommitsResponse {
  commits: Commit[];
  total: number;
}

fetch('/api/commits')
  .then(response => response.ok ? response.json() as Promise<CommitsResponse> : Promise.reject(response.status))
  .then(({ commits, total }) => {
    const dateFormatter = new Intl.DateTimeFormat('no-NO', { day: '2-digit', month: 'short', year: 'numeric' });

    const renderCommits = (commitsList: HTMLOListElement, commitsToRender: Commit[]) => {
      commitsList.innerHTML = '';
      for (const commit of commitsToRender) {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = commit.html_url;
        link.rel = 'noopener';
        const time = document.createElement('time');
        time.dateTime = commit.date;
        time.textContent = dateFormatter.format(new Date(commit.date));
        const code = document.createElement('code');
        link.textContent = commit.sha.slice(0, 7);
        code.append(link);
        listItem.append(code, document.createTextNode(' — ' + commit.message + ' ('), time, document.createTextNode(')'));
        commitsList.append(listItem);
      }
    };

    const recentCommitsList = document.getElementById('commits') as HTMLOListElement;
    const remainingCommitsList = document.getElementById('commits-complete') as HTMLOListElement;

    // `start` on a reversed <ol> sets the number shown on the first item.
    // recentCommitsList shows commits 1–3 counted from the end, remainingCommitsList shows 4–N.
    recentCommitsList.setAttribute('start', String(total));
    remainingCommitsList.setAttribute('start', String(total - 3));
    renderCommits(recentCommitsList, commits.slice(0, 3));
    renderCommits(remainingCommitsList, commits.slice(3));
  })
  .catch(() => {
    const errorMessage = '<li>klarte ikke å hente commits</li>';
    document.getElementById('commits')!.innerHTML = errorMessage;
    document.getElementById('commits-complete')!.innerHTML = errorMessage;
  });
