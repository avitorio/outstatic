import { NextRequest } from 'next/server'
import { OutstaticApi, Request } from 'outstatic'

export const GET = async (
  req: Request,
  {
    params
  }: {
    params: { ost: string[] }
  }
) => OutstaticApi.GET(req, params)
