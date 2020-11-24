var quill = new Quill('#editor', {
    theme: 'snow'
  });
  document.querySelector('.ql-editor').innerHTML = document.querySelector('#load-post').value
  document.querySelector('.ql-editor').addEventListener('keyup', () =>{
      document.querySelector('#post').value = document.querySelector('.ql-editor').innerHTML
  })
  document.querySelector('.ql-toolbar').addEventListener('click', () =>{
      document.querySelector('#post').value = document.querySelector('.ql-editor').innerHTML
  })