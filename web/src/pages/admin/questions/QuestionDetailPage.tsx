import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  useGetQuestionQuery,
  useApproveQuestionMutation,
  useRejectQuestionMutation,
  usePromoteToOfficialMutation,
  useDeleteQuestionMutation,
  useGetQuestionSkillsQuery,
  useGetQuestionKnowledgeLinksQuery,
} from '../../../store/api/endpoints/questionsApi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit, 
  Award, 
  Clock, 
  Calendar, 
  Hash, 
  BookOpen, 
  Code as CodeIcon,
  Lightbulb,
  Loader2,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const questionId = Number(id)

  const { data: question, isLoading, error } = useGetQuestionQuery(questionId)
  const { data: skills } = useGetQuestionSkillsQuery(questionId)
  const { data: knowledgeLinks } = useGetQuestionKnowledgeLinksQuery(questionId)
  
  const [approveQuestion, { isLoading: isApproving }] = useApproveQuestionMutation()
  const [rejectQuestion, { isLoading: isRejecting }] = useRejectQuestionMutation()
  const [promoteToOfficial, { isLoading: isPromoting }] = usePromoteToOfficialMutation()
  const [deleteQuestion, { isLoading: isDeleting }] = useDeleteQuestionMutation()

  const handleApprove = async () => {
    try {
      await approveQuestion(questionId).unwrap()
    } catch (err) {
      console.error('Failed to approve question', err)
    }
  }

  const handleReject = async () => {
    const feedback = prompt('Enter rejection feedback:')
    if (feedback === null) return
    
    try {
      await rejectQuestion({ id: questionId, feedback }).unwrap()
    } catch (err) {
      console.error('Failed to reject question', err)
    }
  }

  const handlePromote = async () => {
    if (!confirm('Are you sure you want to promote this question to official status?')) return
    
    try {
      await promoteToOfficial(questionId).unwrap()
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } }
      alert(`Failed to promote question: ${error.data?.detail || 'Unknown error'}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) return
    
    try {
      await deleteQuestion(questionId).unwrap()
      navigate('/admin/questions')
    } catch (err) {
      console.error('Failed to delete question', err)
    }
  }

  const renderOptions = () => {
    if (!question) return null

    switch (question.question_type) {
      case 'multiple_choice':
        { const choices = question.options.choices as { id: string; text: string; is_correct: boolean }[]
        return (
          <div className="space-y-3">
            {choices.map((choice: { id: string; text: string; is_correct: boolean }, index: number) => (
              <div
                key={choice.id || index}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200 flex items-center gap-3",
                  choice.is_correct
                    ? "border-green-200 bg-green-50 shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                 <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border",
                    choice.is_correct 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                 )}>
                    {choice.id.toUpperCase()}
                 </div>
                 <span className={cn("flex-grow text-sm", choice.is_correct ? "text-green-900 font-medium" : "text-slate-700")}>
                    {choice.text}
                 </span>
                 {choice.is_correct && (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                 )}
              </div>
            ))}
          </div>
        ) }

      case 'true_false':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              "p-6 rounded-lg border-2 text-center transition-all cursor-default",
              question.options.correct_answer === true
                ? "border-green-500 bg-green-50 text-green-900 font-bold shadow-sm"
                : "border-slate-200 bg-white text-slate-500"
            )}>
              True
              {question.options.correct_answer === true && <div className="text-green-600 text-xs mt-1 font-normal uppercase tracking-wider">Correct Answer</div>}
            </div>
            <div className={cn(
              "p-6 rounded-lg border-2 text-center transition-all cursor-default",
              question.options.correct_answer === false
                ? "border-green-500 bg-green-50 text-green-900 font-bold shadow-sm"
                : "border-slate-200 bg-white text-slate-500"
            )}>
              False
              {question.options.correct_answer === false && <div className="text-green-600 text-xs mt-1 font-normal uppercase tracking-wider">Correct Answer</div>}
            </div>
          </div>
        )

      case 'coding':
        return (
          <div className="space-y-6">
            <div className="rounded-md overflow-hidden border border-slate-200 bg-slate-950">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">{question.options.language}</span>
                    <span>Starter Code</span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-50">
                    <code>{question.options.starter_code}</code>
                </pre>
            </div>
            {question.options.test_cases && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Test Cases
                </h4>
                <div className="space-y-2">
                  {question.options.test_cases.map((tc: { input: string; expected_output: string }, index: number) => (
                    <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm font-mono flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                          <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Input</span>
                          <code className="text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 block">{tc.input}</code>
                      </div>
                      <div className="hidden md:flex items-center text-slate-300">→</div>
                      <div className="flex-1">
                          <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Expected</span>
                          <code className="text-green-800 bg-green-50 px-2 py-1 rounded border border-green-100 block">{tc.expected_output}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'scenario':
        return (
          <div className="space-y-6">
            {question.options.scenario_description && (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Scenario Description
                </h4>
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{question.options.scenario_description}</p>
              </div>
            )}
            {question.options.expected_approach && (
              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" /> Expected Approach
                </h4>
                <p className="whitespace-pre-wrap text-emerald-800/90 leading-relaxed">{question.options.expected_approach}</p>
              </div>
            )}
          </div>
        )

      default:
        return (
          <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
            {JSON.stringify(question.options, null, 2)}
          </pre>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-[50vh]">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900">Question Not Found</h3>
        <p className="text-slate-500 mb-4">The question you are looking for does not exist or has been deleted.</p>
        <Link to="/admin/questions">
            <Button>Return to List</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
         <div className="space-y-2">
             <Link to="/admin/questions" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-2 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Questions
             </Link>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                {question.title}
             </h1>
             <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className={cn(
                    "capitalize",
                    question.status === 'approved' && "bg-green-50 text-green-700 border-green-200",
                    question.status === 'pending_review' && "bg-amber-50 text-amber-700 border-amber-200",
                    question.status === 'rejected' && "bg-red-50 text-red-700 border-red-200",
                )}>{question.status.replace('_', ' ')}</Badge>
                
                <Badge variant="secondary" className="capitalize">
                    {question.difficulty}
                </Badge>
                
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 capitalize">
                    {question.question_type.replace('_', ' ')}
                </Badge>
                
                {question.is_official && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">
                        <Award className="h-3 w-3 mr-1" /> Official
                    </Badge>
                )}
             </div>
         </div>

         {/* Actions Bar */}
         <div className="flex flex-wrap gap-2 animate-in slide-in-from-right-5 fade-in duration-500">
             {question.status === 'pending_review' && (
                <>
                  <Button onClick={handleApprove} disabled={isApproving} className="bg-green-600 hover:bg-green-700">
                    {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />} Approve
                  </Button>
                  <Button onClick={handleReject} disabled={isRejecting} variant="destructive">
                    {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />} Reject
                  </Button>
                </>
              )}
              
              {question.status === 'approved' && !question.is_official && (
                <Button onClick={handlePromote} disabled={isPromoting} variant="outline" className="border-amber-200 hover:bg-amber-50 text-amber-700">
                    <Award className="h-4 w-4 mr-2" /> Promote
                </Button>
              )}

             <Link to={`/admin/questions/${questionId}/edit`}>
                <Button variant="outline" className="bg-white">
                    <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
             </Link>
             
             <Button onClick={handleDelete} disabled={isDeleting} variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                 <Trash2 className="h-4 w-4" />
             </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
            {/* Problem Statement */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-800">Problem Statement</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="prose prose-slate max-w-none text-slate-800">
                         <p className="whitespace-pre-wrap leading-relaxed">{question.content}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Answer / Options */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-800">
                         {question.question_type === 'scenario' ? 'Approach' : 'Answer Options'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                     {renderOptions()}
                </CardContent>
            </Card>

            {/* Explanation */}
            {question.explanation && (
                <Card className="border-blue-100 bg-blue-50/30 shadow-sm overflow-hidden">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                         <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" /> Explanation
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="whitespace-pre-wrap text-blue-900/80 leading-relaxed">{question.explanation}</p>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-2"><Hash className="h-4 w-4" /> ID</span>
                        <span className="font-mono text-slate-900">{question.id}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-2"><Clock className="h-4 w-4" /> Est. Time</span>
                        <span className="font-medium text-slate-900">{question.estimated_time_seconds ? Math.floor(question.estimated_time_seconds / 60) + ' min' : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Created</span>
                        <span className="text-slate-900">{new Date(question.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-slate-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Updated</span>
                        <span className="text-slate-900">{new Date(question.updated_at).toLocaleDateString()}</span>
                    </div>
                </CardContent>
            </Card>

            {question.tags && question.tags.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Tag className="h-4 w-4" /> Tags
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {question.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {skills && skills.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <CodeIcon className="h-4 w-4" /> Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-3">
                            {skills.map((skill) => (
                                <div key={skill.id} className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{skill.name}</span>
                                        <span className="text-xs text-slate-500">{skill.category}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">{Math.round(skill.relevance_score * 100)}%</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {knowledgeLinks && knowledgeLinks.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                     <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> Linked Knowledge
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-3">
                            {knowledgeLinks.map((link) => (
                                <div key={link.id} className="p-3 rounded-md bg-slate-50 border border-slate-100">
                                    <div className="flex justify-between items-start mb-1">
                                         <span className="text-xs font-semibold text-slate-700">ID: {link.knowledge_id}</span>
                                         <span className="text-[10px] uppercase font-bold text-slate-400">{link.link_type}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${link.relevance_score * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  )
}
