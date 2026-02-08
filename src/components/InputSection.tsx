import React, { useState, useRef } from 'react'

import { type CountryOption, MeasurementStandard } from '@/util/types'
import { Mesurement_Standards, COUNTRIES, sampleProjectDescription } from '@/util/constents';
interface InputSectionProps {
    onGenerate: (description: string, standerd: MeasurementStandard, country: CountryOption, file?: { mimeType: string; data: string }) => void;
    isLoading: boolean;
}
function InputSection({ onGenerate, isLoading }: InputSectionProps) {
    const [description, setDescription] = useState('');
    const [measurementStandard, setMeasurementStandard] = useState<MeasurementStandard>(Mesurement_Standards[0]);
    const [contryCode, setCountryCode] = useState<string>(COUNTRIES[0].code);

    // file state
    const [slectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!description.trim() && !slectedFile) return;
        const selectedCountry = COUNTRIES.find(c => c.code === contryCode) || COUNTRIES[0];

        let fileData = undefined;

        if (slectedFile) {
            try {
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(slectedFile);
                    reader.onload = () => {
                        const result = reader.result as string;
                        const parts = result.split(',');
                        const base64 = parts.length > 1 ? parts[1] : parts[0];
                        resolve(base64);
                    }
                    reader.onerror = error => reject(error);
                });
                fileData = {
                    mimeType: slectedFile.type,
                    data: base64Data
                }
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Failed to read the file. Please try again.');
                return;
            }
        }
        onGenerate(description, measurementStandard, selectedCountry, fileData);

    };

    const handleLoadSample = () =>{
        setDescription(sampleProjectDescription);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]){
            const file = e.target.files[0];
            if(file.size> 5 * 1024 * 1024){
                alert('File size exceeds 5MB limit. Please choose a smaller file.');
                return;
            }
            setSelectedFile(file);

            if(file.type.startsWith('image/')){
                setFilePreview(URL.createObjectURL(file));
            }
            else{
                setFilePreview(null);
            }
        }
    };

    const clearFile = () => {
        if(filePreview) URL.revokeObjectURL(filePreview);
        setSelectedFile(null);
        setFilePreview(null);
        if(fileInputRef.current){
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-slate-900/20 border border-slate-100 dark:border-slate-700 p-8 mb-10 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/40'>
            <div className='flex justify-between items-center mb-6'>
                <h3 className='text-xl font-bold text-slate-800 dark:text-slate-100'>Project Configuration</h3>
                <span className='text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 rounded-full px-3 py-1 text-indigo-700 dark:text-indigo-300 bodrer border-indigo-100 dark:border-indigo-900'>AI Powerd</span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
                
            </div>

        </div>
    )
}

export default InputSection
