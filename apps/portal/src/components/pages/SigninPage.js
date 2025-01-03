import React from 'react';
import ActionButton from '../common/ActionButton';
import CloseButton from '../common/CloseButton';
// import SiteTitleBackButton from '../common/SiteTitleBackButton';
import AppContext from '../../AppContext';
import InputForm from '../common/InputForm';
import {ValidateInputForm} from '../../utils/form';
import {isSigninAllowed} from '../../utils/helpers';
import {ReactComponent as InvitationIcon} from '../../images/icons/invitation.svg';

export default class SigninPage extends React.Component {
    static contextType = AppContext;

    constructor(props) {
        super(props);
        this.state = {
            email: ''
        };
    }

    componentDidMount() {
        const {member} = this.context;
        if (member) {
            this.context.onAction('switchPage', {
                page: 'accountHome'
            });
        }
    }

    handleSignin(e) {
        e.preventDefault();
        this.setState((state) => {
            return {
                errors: ValidateInputForm({fields: this.getInputFields({state}), t: this.context.t})
            };
        }, async () => {
            // 개인회원 로그인 수정 시작
            //const {email, phonenumber, errors} = this.state;
            const {email, password, errors} = this.state;
            // 개인회원 로그인 수정 종료
            const {redirect} = this.context.pageData ?? {};
            const hasFormErrors = (errors && Object.values(errors).filter(d => !!d).length > 0);
            if (!hasFormErrors) {
                // 개인회원 로그인 수정 시작
                //this.context.onAction('signin', {email, phonenumber, redirect});
                this.context.onAction('memberLoginPassword', {email, password, redirect});
                // 개인회원 로그인 수정 종료
            }
        });
    }

    handleInputChange(e, field) {
        const fieldName = field.name;
        this.setState({
            [fieldName]: e.target.value
        });
    }

    onKeyDown(e) {
        // Handles submit on Enter press
        if (e.keyCode === 13){
            this.handleSignin(e);
        }
    }

    // 개인회원 로그인 수정 시작
    getInputFields({state}) {
        const {t} = this.context;

        const errors = state.errors || {};
        const fields = [
            {
                type: 'email',
                value: state.email,
                placeholder: 'jamie@example.com',
                label: t('Email'),
                name: 'email',
                required: true,
                errorMessage: errors.email || '',
                autoFocus: true
            },
            {
                type: 'password',
                value: state.password,
                placeholder: '•••••••••••••••',
                label: 'Password',
                name: 'password',
                required: true,
                errorMessage: errors.password || '',
                autoFocus: true
            }
        ];

        return fields;
    }
    // 개인회원 로그인 수정 종료

    renderSubmitButton() {
        const {action, t} = this.context;
        let retry = false;
        const isRunning = (action === 'signin:running');
        // 개인회원 로그인 수정 시작
        let label = isRunning ? t('login running...') : t('Continue');
        // 개인회원 로그인 수정 종료
        const disabled = isRunning ? true : false;
        if (action === 'signin:failed') {
            label = t('Retry');
            retry = true;
        }
        return (
            <ActionButton
                dataTestId='memberLoginPassword'
                retry={retry}
                style={{width: '100%'}}
                onClick={e => this.handleSignin(e)}
                disabled={disabled}
                brandColor={this.context.brandColor}
                label={label}
                isRunning={isRunning}
            />
        );
    }

    renderForm() {
        const {site, t} = this.context;

        if (!isSigninAllowed({site})) {
            return (
                <section>
                    <div className='gh-portal-section'>
                        <p
                            className='gh-portal-members-disabled-notification'
                            data-testid="members-disabled-notification-text"
                        >
                            {t('Memberships unavailable, contact the owner for access.')}
                        </p>
                    </div>
                </section>
            );
        }

        return (
            <section>
                <div className='gh-portal-section'>
                    <InputForm
                        fields={this.getInputFields({state: this.state})}
                        onChange={(e, field) => this.handleInputChange(e, field)}
                        onKeyDown={(e, field) => this.onKeyDown(e, field)}
                    />
                </div>
                <footer className='gh-portal-signin-footer'>
                    {this.renderSubmitButton()}
                </footer>
            </section>
        );
    }

    renderSiteIcon() {
        const iconStyle = {};
        const {site} = this.context;
        const siteIcon = site.icon;

        if (siteIcon) {
            iconStyle.backgroundImage = `url(${siteIcon})`;
            return (
                <img className='gh-portal-signup-logo' src={siteIcon} alt={this.context.site.title} />
            );
        } else if (!isSigninAllowed({site})) {
            return (
                <InvitationIcon className='gh-portal-icon gh-portal-icon-invitation' />
            );
        }
        return null;
    }

    renderSiteTitle() {
        const {site, t} = this.context;
        const siteTitle = site.title;

        if (!isSigninAllowed({site})) {
            return (
                <h1 className='gh-portal-main-title'>{siteTitle}</h1>
            );
        } else {
            return (
                <h1 className='gh-portal-main-title'>{t('Sign in')}</h1>
            );
        }
    }

    renderFormHeader() {
        return (
            <header className='gh-portal-signin-header'>
                {this.renderSiteIcon()}
                {this.renderSiteTitle()}
            </header>
        );
    }

    render() {
        return (
            <>
                <CloseButton />
                <div className='gh-portal-logged-out-form-container'>
                    <div className='gh-portal-content signin'>
                        {this.renderFormHeader()}
                        {this.renderForm()}
                    </div>
                </div>
            </>
        );
    }
}