<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuotationCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Quotation $quotation;

    public function __construct(Quotation $quotation)
    {
        $this->quotation = $quotation;
    }

    public function build()
    {
        return $this->subject('ERCA Ev Destek — Fiyat Teklifiniz Hazır')
                    ->view('emails.quotation_created');
    }
}
