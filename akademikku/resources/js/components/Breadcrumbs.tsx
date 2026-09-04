import type { BreadcrumbItem as BreadcrumbItemType } from '@/types'
import { Link } from '@inertiajs/react'
import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbsProps {
  breadcrumbs?: BreadcrumbItemType[]
}

export function Breadcrumbs({ breadcrumbs = [] }: BreadcrumbsProps) {
  if (breadcrumbs.length === 0)
    return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <React.Fragment key={item.href || index}>
              <BreadcrumbItem>
                {isLast
                  ? (
                      <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    )
                  : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.title}</Link>
                      </BreadcrumbLink>
                    )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
