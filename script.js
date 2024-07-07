let projects = JSON.parse(localStorage.getItem('projects')) || {};
let currentProject = null;
let currentFile = null;

function saveProjects() {
  localStorage.setItem('projects', JSON.stringify(projects));
}

function addProject() {
  const projectName = prompt('Enter project name:');
  if (projectName) {
    projects[projectName] = { folders: {}, files: {} };
    saveProjects();
    loadProjects();
  }
}

function loadProjects() {
  const projectList = document.getElementById('project-list');
  projectList.innerHTML = '';
  for (const project in projects) {
    const option = document.createElement('option');
    option.value = project;
    option.textContent = project;
    projectList.appendChild(option);
  }
}

function loadProject(projectName) {
  currentProject = projectName;
  currentFile = null;
  document.getElementById('code-editor').value = '';
  loadFolders();
  loadFiles();
  loadFileTabs();
}

function addFolder() {
  const folderName = prompt('Enter folder name:');
  if (folderName && currentProject) {
    projects[currentProject].folders[folderName] = {};
    saveProjects();
    loadFolders();
  }
}

function loadFolders() {
  const folderList = document.getElementById('folder-list');
  folderList.innerHTML = '';
  const folders = projects[currentProject]?.folders || {};
  for (const folder in folders) {
    const li = document.createElement('li');
    li.textContent = folder;
    folderList.appendChild(li);
  }
}

function addFile() {
  const fileName = prompt('Enter file name:');
  if (fileName && currentProject) {
    projects[currentProject].files[fileName] = '';
    saveProjects();
    loadFiles();
    loadFileTabs();
  }
}

function loadFiles() {
  const fileList = document.getElementById('file-list');
  fileList.innerHTML = '';
  const files = projects[currentProject]?.files || {};
  for (const file in files) {
    const li = document.createElement('li');
    li.textContent = file;
    li.onclick = () => openFile(file);
    fileList.appendChild(li);
  }
}

function openFile(fileName) {
  currentFile = fileName;
  document.getElementById('code-editor').value = projects[currentProject].files[fileName];
  loadFileTabs();
  document.getElementById('file-tabs').value = fileName;
}

function switchFile(fileName) {
  if (currentProject && currentFile) {
    projects[currentProject].files[currentFile] = document.getElementById('code-editor').value;
    saveProjects();
  }
  openFile(fileName);
}

function saveCurrentFile() {
  if (currentProject && currentFile) {
    projects[currentProject].files[currentFile] = document.getElementById('code-editor').value;
    saveProjects();
  }
}

function loadFileTabs() {
  const fileTabs = document.getElementById('file-tabs');
  fileTabs.innerHTML = '';
  const files = projects[currentProject]?.files || {};
  for (const file in files) {
    const option = document.createElement('option');
    option.value = file;
    option.textContent = file;
    fileTabs.appendChild(option);
  }
}

function previewInBrowser() {
  const previewWindow = window.open('', '_blank');
  const editorContent = document.getElementById('code-editor').value;
  previewWindow.document.open();
  previewWindow.document.write(editorContent);
  previewWindow.document.close();
}

function exportProjectToZip() {
  if (!currentProject) return;

  const zip = new JSZip();
  const projectData = projects[currentProject];

  // Add files to the zip
  for (const fileName in projectData.files) {
    zip.file(fileName, projectData.files[fileName]);
  }

  // Add folders to the zip
  for (const folderName in projectData.folders) {
    const folder = zip.folder(folderName);
    for (const fileName in projectData.folders[folderName]) {
      folder.file(fileName, projectData.folders[folderName][fileName]);
    }
  }

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, `${currentProject}.zip`);
  });
}

function importProject(files) {
  const file = files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const zip = new JSZip();
    zip.loadAsync(event.target.result).then(function(contents) {
      const projectData = { folders: {}, files: {} };

      // Extract files and folders from ZIP
      for (const fileName in contents.files) {
        if (contents.files[fileName].dir) {
          // It's a folder
          continue;
        }
        contents.files[fileName].async('string').then(function(fileData) {
          if (fileName.includes('/')) {
            // Nested file in folder
            const [folderName, nestedFileName] = fileName.split('/');
            if (!projectData.folders[folderName]) {
              projectData.folders[folderName] = {};
            }
            projectData.folders[folderName][nestedFileName] = fileData;
          } else {
            // Top-level file
            projectData.files[fileName] = fileData;
          }
        });
      }

      // Add project to projects and save
      const projectName = prompt('Enter project name for import:');
      if (projectName) {
        projects[projectName] = projectData;
        saveProjects();
        loadProjects();
      }
    });
  };

  reader.readAsArrayBuffer(file);
}

window.onload = function() {
  loadProjects();
  if (Object.keys(projects).length > 0) {
    const projectList = document.getElementById('project-list');
    projectList.selectedIndex = 0;
    loadProject(projectList.value);
  }
};