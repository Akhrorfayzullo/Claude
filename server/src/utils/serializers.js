export function serializeProject(projectDocument) {
  return {
    id: projectDocument._id.toString(),
    title: projectDocument.title,
    description: projectDocument.description,
    href: projectDocument.href,
    tags: projectDocument.tags,
    sortOrder: projectDocument.sortOrder,
    createdAt: projectDocument.createdAt,
    updatedAt: projectDocument.updatedAt,
  }
}

export function serializeResume(resumeDocument) {
  return {
    id: resumeDocument._id.toString(),
    filename: resumeDocument.originalName,
    mimeType: resumeDocument.mimeType,
    size: resumeDocument.size,
    updatedAt: resumeDocument.updatedAt,
    viewUrl: '/api/resume/file',
    downloadUrl: '/api/resume/file?download=1',
  }
}

export function serializeProfileImage(profileImageDocument) {
  return {
    id: profileImageDocument._id.toString(),
    filename: profileImageDocument.originalName,
    mimeType: profileImageDocument.mimeType,
    size: profileImageDocument.size,
    updatedAt: profileImageDocument.updatedAt,
    viewUrl: '/api/profile-image/file',
  }
}
