import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Papa from "papaparse"
import { Upload, FileText } from "lucide-react"

export default function UploadAlunosCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [status, setStatus] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
  }

  const handleUpload = () => {
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[]
        setAlunos(data)
        setStatus("Arquivo lido com sucesso! Pronto para processar dados.")
        console.table(data)
      },
      error: () => setStatus("Erro ao processar o CSV. Verifique o formato.")
    })
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Importar Alunos via CSV</h1>

      <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} />
          <Button onClick={handleUpload} disabled={!file}>
            <Upload className="w-4 h-4 mr-2" /> Ler CSV
          </Button>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </CardContent>
      </Card>

      {alunos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-lg mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Prévia dos Dados
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {alunos.slice(0, 5).map((a, i) => (
                <li key={i}>
                  {a.Nome} ({a["Série / Departamento"]} - {a["Escola / Empresa"]})
                </li>
              ))}
              {alunos.length > 5 && <li>...e mais {alunos.length - 5} alunos</li>}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
