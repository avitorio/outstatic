import { OutstaticApi, Request, QueryType } from 'outstatic'

export const GET = async (req: Request, params: QueryType) =>
  OutstaticApi.GET(req, params)
