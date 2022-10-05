import Image from 'next/image'
import { CustomCode, Pre } from './CustomCode'
import CustomLink from './CustomLink'

const MDXComponents = {
  a: CustomLink,
  Image,
  pre: Pre,
  code: CustomCode
}

export default MDXComponents
