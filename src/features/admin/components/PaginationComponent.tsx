import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import Button, { buttonVariants } from "@/shared/components/Button"

type PaginationComponentProps = {
  page: number
  totalPages: number
  totalItems: number
  pageStart: number
  pageEnd: number
  onPageChange: (page: number) => void
}

const clampPage = (value: number, max: number) => Math.min(Math.max(1, value), Math.max(1, max))

const getVisiblePages = (current: number, total: number) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) {
    pages.push("ellipsis")
  }

  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    pages.push(pageNumber)
  }

  if (end < total - 1) {
    pages.push("ellipsis")
  }

  pages.push(total)

  return pages
}

export function PaginationComponent({
  page,
  totalPages,
  totalItems,
  pageStart,
  pageEnd,
  onPageChange,
}: PaginationComponentProps) {
  const safeTotalPages = Math.max(1, totalPages)
  const currentPage = clampPage(page, safeTotalPages)

  if (totalItems === 0) return null

  const visiblePages = getVisiblePages(currentPage, safeTotalPages)
  const startDisplay = Math.min(totalItems, Math.max(1, pageStart + 1))
  const endDisplay = Math.min(totalItems, Math.max(startDisplay, pageEnd))
  const summaryLabel = `Showing ${startDisplay} - ${endDisplay} of ${totalItems}`

  const handlePageChange = (next: number) => {
    const target = clampPage(next, safeTotalPages)
    if (target !== currentPage) {
      onPageChange(target)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="sr-only" aria-live="polite">
        {summaryLabel}
      </span>

      <div className="flex flex-1 items-center justify-between gap-3 lg:flex-0">
        <Button
          variant="secondary"
          size="sm"
          className="h-9 w-20"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <div className="flex items-center gap-1">
            <ChevronLeft strokeWidth={2.5} className="h-5 w-5" />
            <span>Prev</span>
          </div>
        </Button>

        <div className="flex flex-wrap justify-center gap-2" aria-label={summaryLabel}>
          {visiblePages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-10 items-center justify-center text-sm text-gray-500"
                aria-hidden
              >
                <MoreHorizontal className="h-5 w-5" />
              </span>
            ) : (
              <button
                type="button"
                key={item}
                onClick={() => handlePageChange(item)}
                className={cn(
                  buttonVariants({ variant: item === currentPage ? "outline" : "ghost", size: "sm" }),
                  "h-9 w-9 justify-center border border-brand-200"
                )}
                aria-current={item === currentPage ? "page" : undefined}
                aria-label={`Go to page ${item}`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="h-9 w-20"
          disabled={currentPage === safeTotalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <div className="flex items-center gap-1">
            <span>Next</span>
            <ChevronRight strokeWidth={2.5} className="h-5 w-5" />
          </div>
        </Button>
      </div>
    </div>
  )
}
