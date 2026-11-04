import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { App, Button, Card, Drawer, Form, Input, Segmented, Select, Table, Tag, type TableProps } from 'antd'
import { useState } from 'react'
import { Icon } from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { createJob, type NewJob } from '../../services/opsService'
import { devicesQuery, jobsQuery } from '../../services/queries'
import type { Job, JobState } from '../../types/ops'
import { ago, formatDateTime } from '../../utils/time'

const STATE_COLOR: Record<JobState, string> = { queued: 'default', running: 'processing', done: 'success', failed: 'error' }
const SHELLS = ['PowerShell', 'CMD', 'Bash']
const WHEN = [
  { value: 'now', label: 'Run now' },
  { value: 'Every day at 02:00', label: 'Daily 02:00' },
  { value: 'Every Monday at 07:00', label: 'Weekly Mon 07:00' },
]

export default function JobsPage() {
  const { data: jobs } = useSuspenseQuery(jobsQuery)
  const { data: devices } = useSuspenseQuery(devicesQuery)
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<NewJob & { when: string }>()

  const groups = [...new Set(devices.map((d) => d.group))].sort()

  const create = useMutation({
    mutationFn: createJob,
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      setOpen(false)
      form.resetFields()
      message.success(job.schedule ? `"${job.name}" scheduled` : `"${job.name}" started on ${job.results.length} devices`)
    },
    onError: (error) => message.error(error.message),
  })

  const columns: TableProps<Job>['columns'] = [
    {
      title: 'Job',
      key: 'name',
      render: (_, j) => (
        <>
          <span className="strong">{j.name}</span>
          <div className="sub">
            <code>{j.command}</code>
          </div>
        </>
      ),
    },
    { title: 'Targets', key: 'targets', render: (_, j) => j.targets.map((t) => <Tag key={t}>{t}</Tag>) },
    { title: 'Shell', dataIndex: 'shell' },
    { title: 'State', key: 'state', render: (_, j) => <Tag color={STATE_COLOR[j.state]}>{j.state}</Tag> },
    {
      title: 'When',
      key: 'when',
      render: (_, j) => (j.schedule ? <span className="muted">{j.schedule}</span> : ago(j.startedAt)),
    },
    {
      title: 'Results',
      key: 'results',
      render: (_, j) =>
        j.results.length === 0 ? (
          <span className="muted">—</span>
        ) : (
          `${j.results.filter((r) => r.state === 'done').length} / ${j.results.length} ok`
        ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        title="Command & Jobs"
        subtitle="Run a command across groups at once, now or on a schedule, and keep every result."
        actions={
          <Button type="primary" icon={<Icon name="plus" size={14} />} onClick={() => setOpen(true)}>
            New job
          </Button>
        }
      />

      <Card className="table-card" styles={{ body: { padding: 0 } }}>
        <Table<Job>
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          expandable={{
            rowExpandable: (j) => j.results.length > 0,
            expandedRowRender: (j) => (
              <div className="job-results">
                {j.results.map((r) => (
                  <div key={r.host} className="job-result">
                    <Tag color={STATE_COLOR[r.state]}>{r.state}</Tag>
                    <span className="strong">{r.host}</span>
                    <span className="muted">exit {r.exitCode}</span>
                    <span>{r.output}</span>
                  </div>
                ))}
                <div className="sub">Started {formatDateTime(j.startedAt)}</div>
              </div>
            ),
          }}
          locale={{ emptyText: <span className="muted">No jobs have been run yet.</span> }}
        />
      </Card>

      <Drawer title="New job" open={open} onClose={() => setOpen(false)} size={520}>
        <Form<NewJob & { when: string }>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ shell: 'PowerShell', when: 'now', targets: [] }}
          onFinish={({ when, ...job }) => create.mutate({ ...job, schedule: when === 'now' ? undefined : when })}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name this job.' }]}>
            <Input placeholder="Collect agent logs" />
          </Form.Item>
          <Form.Item name="shell" label="Shell">
            <Segmented options={SHELLS} />
          </Form.Item>
          <Form.Item name="command" label="Command" rules={[{ required: true, message: 'Enter the command to run.' }]}>
            <Input.TextArea rows={3} placeholder="Get-Service | Where-Object Status -eq Stopped" />
          </Form.Item>
          <Form.Item
            name="targets"
            label="Targets"
            extra="Pick whole groups, or single devices."
            rules={[{ required: true, message: 'Pick at least one target.' }]}
          >
            <Select
              mode="multiple"
              placeholder="Groups or devices"
              options={[
                { label: 'Groups', options: groups.map((g) => ({ value: g, label: g })) },
                { label: 'Devices', options: devices.map((d) => ({ value: d.host, label: `${d.host} · ${d.alias}` })) },
              ]}
            />
          </Form.Item>
          <Form.Item name="when" label="When">
            <Segmented options={WHEN} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={create.isPending}>
            Create job
          </Button>
        </Form>
      </Drawer>
    </div>
  )
}
