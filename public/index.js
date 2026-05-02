fetch('/api/commits')
  .then(r => r.ok ? r.json() : Promise.reject(r.status))
  .then(({ commits, total }) => {
    const fmt = new Intl.DateTimeFormat('no-NO', { day: '2-digit', month: 'short', year: 'numeric' });
    const render = (el, items) => {
      el.innerHTML = '';
      for (const commit of items) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = commit.html_url;
        a.rel = 'noopener';
        const time = document.createElement('time');
        time.dateTime = commit.date;
        time.textContent = fmt.format(new Date(commit.date));
        const code = document.createElement('code');
        a.textContent = commit.sha.slice(0, 7);
        code.append(a);
        li.append(code, document.createTextNode(' — ' + commit.message + ' ('), time, document.createTextNode(')'));
        el.append(li);
      }
    };
    const top = document.getElementById('commits');
    const rest = document.getElementById('commits-complete');
    top.setAttribute('start', total);
    rest.setAttribute('start', total - 3);
    render(top, commits.slice(0, 3));
    render(rest, commits.slice(3));
  })
  .catch(() => {
    const msg = '<li>klarte ikke å hente commits</li>';
    document.getElementById('commits').innerHTML = msg;
    document.getElementById('commits-complete').innerHTML = msg;
  });
