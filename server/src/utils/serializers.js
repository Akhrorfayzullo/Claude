export function serializeProject(projectDocument) {
  return {
    // MongoDB stores _id as an ObjectId object — convert to string for the frontend
    id: projectDocument._id.toString(),
    title: projectDocument.title,
    description: projectDocument.description,
    href: projectDocument.href,
    tags: projectDocument.tags,
    sortOrder: projectDocument.sortOrder,
    // ?? null: if imageUrl is undefined or null, send null explicitly
    imageUrl: projectDocument.imageUrl ?? null,
    createdAt: projectDocument.createdAt,
    updatedAt: projectDocument.updatedAt,
    // imagePath intentionally excluded — it's the server's internal file path, not safe to expose
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

export function serializeSkill(skillDocument) {
  return {
    id: skillDocument._id.toString(),
    name: skillDocument.name,
    category: skillDocument.category,
    sortOrder: skillDocument.sortOrder,
  }
}
