'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Download, Database, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface TableData {
  [tableName: string]: {
    data: Record<string, unknown>[]
    count: number
    error?: string
  }
}

export default function DebugPage() {
  const [tableData, setTableData] = useState<TableData>({})
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  // All tables from your schema
  const tables = [
    'profiles',
    'rooms',
    'room_members',
    'bills',
    'bill_participants',
    'bill_payers',
    'bill_settlements',
    'bill_calculations',
    'bill_categories',
    'bill_coverage',
    'bill_extras',
    'bill_items',
    'bill_receipts',
    'bill_suggested_transfers',
    'expense_categories',
    'notifications',
    'recurring_templates'
  ]

  // All views from your database
  const views = [
    'v_advanced_bill_details',
    'v_bill_balance_summary',
    'v_bill_paid',
    'v_bill_settlement_totals',
    'v_bill_shares',
    'v_bill_user_position',
    'v_enhanced_bill_details',
    'v_room_overall_net',
    'v_unified_bill_user_position',
    'v_user_bill_items'
  ]

  // Combine tables and views for fetching
  const allTableAndViews = [...tables, ...views]

  const fetchAllTableData = async () => {
    setLoading(true)
    const data: TableData = {}

    try {
      for (const table of allTableAndViews) {
        try {
          const { data: tableRows, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })

          if (error) {
            data[table] = {
              data: [],
              count: 0,
              error: error.message
            }
          } else {
            data[table] = {
              data: tableRows || [],
              count: count || 0
            }
          }
        } catch (err) {
          data[table] = {
            data: [],
            count: 0,
            error: err instanceof Error ? err.message : 'Unknown error'
          }
        }
      }

      setTableData(data)
      setLastFetch(new Date())
      toast.success('Database snapshot captured successfully!')
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch database data')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    const jsonData = JSON.stringify(tableData, null, 2)
    navigator.clipboard.writeText(jsonData)
    toast.success('JSON data copied to clipboard!')
  }

  const downloadJson = () => {
    const jsonData = JSON.stringify(tableData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `roomledger-debug-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('JSON file downloaded!')
  }

  const getTotalRecords = () => {
    return Object.values(tableData).reduce((total, table) => total + table.count, 0)
  }

  const getTablesWithErrors = () => {
    return Object.entries(tableData).filter(([, table]) => table.error)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Database Debug Tool</h1>
                  <p className="text-red-100">Development/Diagnostic Tool - Delete Before Production</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3">
                  <Button
                    onClick={fetchAllTableData}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    {loading ? 'Fetching...' : 'Fetch All Tables'}
                  </Button>

                  {Object.keys(tableData).length > 0 && (
                    <>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy JSON
                      </Button>

                      <Button
                        onClick={downloadJson}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download JSON
                      </Button>
                    </>
                  )}
                </div>

                {lastFetch && (
                  <div className="text-sm text-gray-600">
                    Last fetch: {lastFetch.toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary */}
        {Object.keys(tableData).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{tables.length}</div>
                    <div className="text-sm text-gray-600">Tables</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{views.length}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{getTotalRecords()}</div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{getTablesWithErrors().length}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                </div>

                {getTablesWithErrors().length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Tables with Errors:</h4>
                    <div className="space-y-1">
                      {getTablesWithErrors().map(([tableName, table]) => (
                        <div key={tableName} className="text-sm text-red-700">
                          <span className="font-medium">{tableName}:</span> {table.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Table and View Details */}
        {Object.keys(tableData).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Tables Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Tables ({tables.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((tableName) => {
                  const table = tableData[tableName]
                  if (!table) return null

                  return (
                    <Card key={tableName} className={table.error ? 'border-red-200' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{tableName}</span>
                          <Badge variant={table.error ? 'destructive' : table.count > 0 ? 'default' : 'secondary'}>
                            {table.error ? 'Error' : table.count}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {table.error ? (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {table.error}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">
                              {table.count} record{table.count !== 1 ? 's' : ''}
                            </div>
                            {table.count > 0 && table.data.length > 0 && (
                              <div className="text-xs text-gray-500">
                                <div className="font-medium mb-1">Sample fields:</div>
                                <div className="space-y-1">
                                  {Object.keys(table.data[0]).slice(0, 5).map((field) => (
                                    <div key={field} className="truncate">
                                      {field}
                                    </div>
                                  ))}
                                  {Object.keys(table.data[0]).length > 5 && (
                                    <div className="text-gray-400">
                                      +{Object.keys(table.data[0]).length - 5} more...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Views Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">V</span>
                </div>
                Views ({views.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {views.map((viewName) => {
                  const view = tableData[viewName]
                  if (!view) return null

                  return (
                    <Card key={viewName} className={view.error ? 'border-red-200' : 'border-purple-200 bg-purple-50/30'}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span className="text-purple-700">{viewName}</span>
                          <Badge variant={view.error ? 'destructive' : view.count > 0 ? 'default' : 'secondary'}>
                            {view.error ? 'Error' : view.count}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {view.error ? (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {view.error}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">
                              {view.count} record{view.count !== 1 ? 's' : ''}
                            </div>
                            {view.count > 0 && view.data.length > 0 && (
                              <div className="text-xs text-gray-500">
                                <div className="font-medium mb-1">Sample fields:</div>
                                <div className="space-y-1">
                                  {Object.keys(view.data[0]).slice(0, 5).map((field) => (
                                    <div key={field} className="truncate">
                                      {field}
                                    </div>
                                  ))}
                                  {Object.keys(view.data[0]).length > 5 && (
                                    <div className="text-gray-400">
                                      +{Object.keys(view.data[0]).length - 5} more...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* JSON Preview */}
        {Object.keys(tableData).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>JSON Preview (First 1000 characters)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(tableData, null, 2).substring(0, 1000)}
                  {JSON.stringify(tableData, null, 2).length > 1000 && '\n... (truncated)'}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Usage Instructions:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Click &ldquo;Fetch All Tables&rdquo; to get current database snapshot</li>
                <li>• Use &ldquo;Copy JSON&rdquo; to copy the data for debugging/analysis</li>
                <li>• Use &ldquo;Download JSON&rdquo; to save the data as a file</li>
                <li>• This page fetches ALL data - use carefully with large datasets</li>
                <li>• Remember to DELETE this debug page before production deployment</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}