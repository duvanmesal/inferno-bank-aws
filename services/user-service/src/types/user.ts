export interface User {
  uuid: string
  name: string
  lastName: string
  email: string
  password: string
  document: string
  address?: string
  phone?: string
  image?: string
  createdAt: string
  updatedAt: string
}

export interface UserResponse {
  uuid: string
  name: string
  lastName: string
  email: string
  document: string
  address?: string
  phone?: string
  image?: string
}

export interface RegisterRequest {
  name: string
  lastName: string
  email: string
  password: string
  document: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  address?: string
  phone?: string
}

export interface UploadAvatarRequest {
  image: string // base64
  fileType: string
}
