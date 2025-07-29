'use client'

import { useParams } from 'next/navigation'
import FSWIronTask from '@/components/forms/FSWIronTask'

export default function ProjectFormsPage() {
  const params = useParams()
  const projectId = params.id as string
  
  return <FSWIronTask projectId={projectId} />
}